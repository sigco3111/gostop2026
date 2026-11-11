// Deliberate public-capture fixture, not a naturally played round or saved progress.
import puppeteer from 'puppeteer-core';
import {readyImages} from './ready-images.mjs';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.QA_OUT||'/tmp/captured-score-detail';mkdirSync(out,{recursive:true});
const server=process.env.GAME_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4177'],{stdio:'ignore'});let b;const report={errors:[],views:[],cases:[]};
try{
 await new Promise(r=>setTimeout(r,500));b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,defaultViewport:{width:390,height:844,isMobile:true,hasTouch:true},args:['--no-sandbox','--no-zygote','--disable-gpu','--renderer-process-limit=2']});const p=await b.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.evaluateOnNewDocument(()=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};});
 await p.goto(process.env.GAME_URL||'http://localhost:4177/gostop2026/');await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand');
 await p.evaluate(()=>{const g=window.__game;window.__canonical=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])].sort((a,b)=>a.id-b.id);});
 for(const mode of ['pi','yeol','zero']){
  await p.evaluate(mode=>{const g=window.__game,d=window.__canonical;let captured=[];if(mode==='pi')captured=[d.find(c=>c.isGukjin),...d.filter(c=>c.kind==='pi'&&c.piValue===1).slice(0,13),...d.filter(c=>c.kind==='yeol'&&!c.isGukjin&&!c.isGodori),d.find(c=>c.isGodori)];if(mode==='yeol')captured=[d.find(c=>c.isGukjin),...d.filter(c=>c.kind==='yeol'&&!c.isGukjin)];const ids=new Set(captured.map(c=>c.id));const remaining=d.filter(c=>!ids.has(c.id));g.players[0].captured=captured;g.players[1].captured=[];g.players[0].hand=remaining.splice(0,1);g.players[1].hand=remaining.splice(0,1);g.floor=remaining.splice(0,4);g.deck=remaining;g.turn=0;g.awaitingChoice=null;g.awaitingGoStop=false;g.over=false;},mode);
  await p.click('.sound-toggle');
  if(mode==='pi')for(const [width,height]of [[320,568],[390,844],[844,320],[1280,844]]){await p.setViewport({width,height,isMobile:true,hasTouch:true});await readyImages(p);await p.screenshot({path:`${out}/board-${width}.png`});if(await p.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('compact board overflow');}
  await p.click('.capture-toggle');await p.waitForSelector('.capture-overlay');
  const texts=await p.$$eval('.capture-breakdown',els=>els.map(e=>e.textContent));const note=await p.$eval('.capture-panel',e=>e.innerText);
  if(texts.length!==2||!texts[1].includes('현재 0점'))throw Error('missing two-player score descriptions');
  if(mode==='pi'&&(!note.includes('쌍피 2장분')||!texts[0].includes('= 8점')))throw Error('pi raw score designation wrong');
  if(mode==='yeol'&&(!note.includes('열끗 1장')||!texts[0].includes('고도리 5점')))throw Error('yeol designation missing');
  if(mode==='zero'&&await p.$('.capture-gukjin'))throw Error('invented gukjin');
  const groups=await p.$$eval('.my-captured .cap-group',els=>els.map(e=>({label:e.querySelector('.cap-label').textContent,cards:[...e.querySelectorAll('img')].map(i=>i.alt)})));
  if(mode==='pi'&&(groups.find(g=>g.label.startsWith('열끗'))?.label!=='열끗 6'||groups.find(g=>g.label.startsWith('피'))?.label!=='피 15'||!groups.find(g=>g.label.startsWith('피'))?.cards.some(c=>c.includes('국진'))))throw Error('compact pi designation differs from score');
  if(mode==='yeol'&&(groups.length!==1||groups[0].label!=='열끗 9'||!groups[0].cards.some(c=>c.includes('국진'))))throw Error('compact yeol designation differs from score');
  if(mode==='zero'&&groups.length)throw Error('invented compact capture group');
  const detailGroups=await p.$$eval('#capture-player-0 .capture-category',els=>els.map(e=>({label:e.querySelector('h4').textContent,cards:[...e.querySelectorAll('.hcard')].map(c=>c.getAttribute('aria-label'))})));
  if(mode==='yeol'&&(detailGroups.length!==1||detailGroups[0].label!=='열끗 · 9장'||!detailGroups[0].cards.some(c=>c.includes('국진'))))throw Error('detail yeol designation differs from score');
  if(mode==='zero'&&(detailGroups.length||await p.$$eval('.capture-empty',els=>els.length)!==2))throw Error('empty capture categories incorrect');
  report.cases.push({mode,texts,note,groups,detailGroups});
  if(mode==='pi')for(const [width,height]of [[320,568],[390,844],[844,320],[1280,844]]){await p.setViewport({width,height,isMobile:true,hasTouch:true});await p.$eval('.capture-panel',e=>{e.scrollTop=0;});await readyImages(p);await p.screenshot({path:`${out}/capture-${width}.png`});
  const stateBefore=await p.evaluate(()=>JSON.stringify(window.__game));
  await p.$eval('.capture-panel',e=>{e.scrollTop=e.scrollHeight;});
  const sticky=await p.evaluate(()=>{const panel=document.querySelector('.capture-panel').getBoundingClientRect(),close=document.querySelector('.capture-close').getBoundingClientRect(),nav=[...document.querySelectorAll('.capture-jump')].map(b=>b.getBoundingClientRect());return close.y>=panel.y&&close.bottom<=panel.bottom&&nav.every(r=>r.height>=44&&r.y>=panel.y&&r.bottom<=panel.bottom);});if(!sticky)throw Error('touch return/navigation scrolled out');
  await p.screenshot({path:`${out}/capture-bottom-${width}.png`});
  for(const player of [0,1]){
   await p.click(`.capture-jump:nth-child(${player+1})`);
   const visible=await p.evaluate(player=>{const h=document.querySelector(`#capture-heading-${player}`),r=h.getBoundingClientRect(),controls=document.querySelector('.capture-controls').getBoundingClientRect(),panel=document.querySelector('.capture-panel').getBoundingClientRect();return document.activeElement===h&&r.top>=controls.bottom-1&&r.bottom<=panel.bottom;},player);if(!visible)throw Error('jump heading hidden behind sticky controls');
   if(player===1)await p.screenshot({path:`${out}/capture-opponent-${width}.png`});
  }
  if(stateBefore!==await p.evaluate(()=>JSON.stringify(window.__game)))throw Error('capture browsing changed game');
  const categories=await p.$$eval('#capture-player-0 .capture-category',xs=>xs.map(x=>({title:x.querySelector('h4').textContent,ids:[...x.querySelectorAll('[data-card-id]')].map(c=>Number(c.dataset.cardId))})));if(categories.length!==2||categories[1].title!=='피 · 15장분'||!categories[1].ids.includes(32))throw Error('capture grouping disagrees with gukjin scoring');
  await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const axe=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));if(axe.violations.length)throw Error('axe violations '+JSON.stringify(axe.violations));if(await p.evaluate(()=>document.body.scrollWidth>innerWidth||document.querySelector('.capture-panel').getBoundingClientRect().height>innerHeight))throw Error('overflow');await p.keyboard.press('Tab');if(!await p.evaluate(()=>!!document.activeElement.closest('.capture-overlay')))throw Error('focus escaped');report.views.push({width,height,axe:0});}
  await p.keyboard.press('Escape');if(await p.$('.capture-overlay'))throw Error('Escape failed');if(!await p.evaluate(()=>document.activeElement.classList.contains('capture-toggle')))throw Error('focus not returned');
 }
 if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await b?.close();server?.kill();}

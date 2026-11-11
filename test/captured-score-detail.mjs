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
 await p.goto(process.env.GAME_URL||'http://localhost:4177/gostop2026/');report.scripts=await p.$$eval('script[src]',els=>els.map(e=>e.src));await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand');
 await p.evaluate(()=>{const g=window.__game;window.__canonical=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])].sort((a,b)=>a.id-b.id);});
 for(const mode of ['pi','yeol','zero','all']){
  // Install deliberate captures during a new deal, before the board renders.
  // Sound is not a render hook: changing it must leave the board in place.
  await p.evaluate(mode=>{const proto=Object.getPrototypeOf(window.__game);window.__originalDeal??=proto.deal;proto.deal=function(){window.__originalDeal.call(this);const g=this,d=window.__canonical;let captured=[];if(mode==='pi')captured=[d.find(c=>c.isGukjin),...d.filter(c=>c.kind==='pi'&&c.piValue===1).slice(0,13),...d.filter(c=>c.kind==='yeol'&&!c.isGukjin&&!c.isGodori),d.find(c=>c.isGodori)];if(mode==='yeol')captured=[d.find(c=>c.isGukjin),...d.filter(c=>c.kind==='yeol'&&!c.isGukjin)];if(mode==='all')captured=d.filter((c,i)=>d.filter(x=>x.kind===c.kind).indexOf(c)%2===0);const ids=new Set(captured.map(c=>c.id));const remaining=d.filter(c=>!ids.has(c.id));g.players[0].captured=captured;g.players[1].captured=mode==='all'?remaining.splice(0,remaining.length-8):[];g.players[0].hand=remaining.splice(0,1);g.players[1].hand=remaining.splice(0,1);g.floor=remaining.splice(0,4);g.deck=remaining;g.turn=0;g.awaitingChoice=null;g.awaitingGoStop=false;g.over=false; return [];};},mode);
  await p.click('.exit-toggle');await p.click('[data-exit=confirm]');await p.waitForSelector('#m-free');await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand');
  if(mode==='pi'||mode==='all')for(const [width,height]of [[320,568],[390,844],[568,320],[844,320],[1280,844]]){await p.setViewport({width,height,isMobile:true,hasTouch:true});await readyImages(p);await p.screenshot({path:`${out}/board-${width}.png`});if(await p.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('compact board overflow');}
  await p.click('.capture-toggle');await p.waitForSelector('.capture-overlay');
  const texts=await p.$$eval('.capture-breakdown',els=>els.map(e=>e.textContent));const note=await p.$eval('.capture-panel',e=>e.innerText);
  if(texts.length!==2||(mode!=='all'&&!texts[1].includes('현재 0점')))throw Error('missing two-player score descriptions');
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
  if(mode==='pi'||mode==='all')for(const [width,height]of [[320,568],[390,844],[568,320],[844,320],[1280,844]]){await p.setViewport({width,height,isMobile:true,hasTouch:true});await p.$eval('.capture-panel',e=>{e.scrollTop=0;});await readyImages(p);await p.screenshot({path:`${out}/capture-${width}.png`});
  const kindBefore=await p.evaluate(()=>({game:JSON.stringify(window.__game),save:localStorage.getItem('gostop2026-save-v1')}));
  for(const player of [0,1]){
   await p.click(`.capture-jump:nth-child(${player+1})`);
   const kinds=await p.$$eval(`#capture-player-${player} .capture-kind`,es=>es.map(e=>({text:e.textContent,disabled:e.disabled,target:e.getAttribute('aria-controls')})));
   if(kinds.length!==4)throw Error('missing category count');
   for(let i=0;i<kinds.length;i++){
    const k=kinds[i];if(k.disabled){if(k.target)throw Error('empty category has target');continue;}
    await p.click(`.capture-jump:nth-child(${player+1})`);
    const selector=`#capture-player-${player} .capture-kind:nth-child(${i+1})`;
    await p.$eval(selector,e=>e.scrollIntoView({block:'center'}));await p.focus(selector);await p.keyboard.press('Enter');
    const reached=await p.evaluate(id=>{const h=document.getElementById(id),r=h.getBoundingClientRect(),controls=document.querySelector('.capture-controls').getBoundingClientRect(),panel=document.querySelector('.capture-panel').getBoundingClientRect();return document.activeElement===h&&r.top>=controls.bottom-1&&r.bottom<=panel.bottom;},k.target);if(!reached)throw Error('category heading hidden '+JSON.stringify({width,player,k}));
    if(player===0&&k.text.startsWith('피')){await readyImages(p);await p.screenshot({path:`${out}/kind-pi-${width}.png`});}
   }
  }
  if(JSON.stringify(kindBefore)!==JSON.stringify(await p.evaluate(()=>({game:JSON.stringify(window.__game),save:localStorage.getItem('gostop2026-save-v1')}))))throw Error('category jump changed state/save');
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
  const categories=await p.$$eval('#capture-player-0 .capture-category',xs=>xs.map(x=>({title:x.querySelector('h4').textContent,ids:[...x.querySelectorAll('[data-card-id]')].map(c=>Number(c.dataset.cardId))})));if(mode==='pi'&&(categories.length!==2||categories[1].title!=='피 · 15장분'||!categories[1].ids.includes(32)))throw Error('capture grouping disagrees with gukjin scoring');
  await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const axe=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));if(axe.violations.length)throw Error('axe violations '+JSON.stringify(axe.violations));if(await p.evaluate(()=>document.body.scrollWidth>innerWidth||document.querySelector('.capture-panel').getBoundingClientRect().height>innerHeight))throw Error('overflow');await p.keyboard.press('Tab');if(!await p.evaluate(()=>!!document.activeElement.closest('.capture-overlay')))throw Error('focus escaped');report.views.push({width,height,axe:0});}
  const closeRect=await p.$eval('.capture-close',e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});await p.touchscreen.tap(closeRect.x,closeRect.y);if(await p.$('.capture-overlay'))throw Error('touch return failed');if(!await p.evaluate(()=>document.activeElement.classList.contains('capture-toggle')))throw Error('touch return focus lost');await p.click('.capture-toggle');await p.waitForSelector('.capture-overlay');
  await p.keyboard.press('Escape');if(await p.$('.capture-overlay'))throw Error('Escape failed');if(!await p.evaluate(()=>document.activeElement.classList.contains('capture-toggle')))throw Error('focus not returned');
 }
 if(report.errors.length)throw Error('runtime errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await b?.close();server?.kill();}

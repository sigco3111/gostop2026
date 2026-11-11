import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {readyImages} from './ready-images.mjs';
const out=process.env.QA_OUT||'/tmp/rename-qa';mkdirSync(out,{recursive:true});
const server=process.env.GAME_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--port','4178'],{stdio:'ignore'});let b;const report={errors:[],views:[],milestoneFixture:true};
try{
 await new Promise(r=>setTimeout(r,400));b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--no-zygote','--renderer-process-limit=2']});const p=await b.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto(process.env.GAME_URL||'http://localhost:4178/gostop2026/');
 await p.evaluate(()=>{localStorage.setItem('gostop2026-deck','comic');localStorage.setItem('gostop2026-save-v1',JSON.stringify({version:1,clearedStages:Array.from({length:12},(_,i)=>i+1),titles:['어둠의 판의 챔피언','어둠의 판의 새 전설'],trophies:4,nagariCarry:8}));});await p.reload();
 for(const width of [320,390,1280]){
  await p.setViewport({width,height:width===320?568:844});if(await p.title()!=='맞고2026 : 패담')throw Error('document title mismatch');
  if(await p.$eval('h1',e=>e.textContent)!=='맞고2026 : 패담')throw Error('visible title mismatch');await readyImages(p);await p.screenshot({path:`${out}/title-${width}.png`});
  if(await p.evaluate(()=>document.body.scrollWidth>innerWidth||document.querySelector('h1').getBoundingClientRect().right>innerWidth))throw Error('title overflow');
  await p.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const axe=await p.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));if(axe.violations.length)throw Error('title axe '+JSON.stringify(axe.violations));
  await p.click('#m-guide');await p.click('[data-tab=credits]');const text=await p.$eval('#guide-content',e=>e.textContent);if(!text.includes('12 / 12')||!text.includes('트로피 4개')||!text.includes('패담의 챔피언')||!text.includes('패담의 새 전설')||text.includes('어둠의 판'))throw Error('legacy milestones not retained with renamed labels');await readyImages(p);await p.screenshot({path:`${out}/records-${width}.png`});await p.click('.guide-back');
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('gostop2026-save-v1')));if(saved.clearedStages.length!==12||saved.trophies!==4||saved.nagariCarry!==8)throw Error('progress reset');if(await p.evaluate(()=>localStorage.getItem('gostop2026-deck'))!=='comic')throw Error('deck choice reset');report.views.push({width,title:'맞고2026 : 패담',axe:0,saved});
 }
 if(report.errors.length)throw Error('runtime error');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await b?.close();server?.kill();}

import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';import {mkdirSync,writeFileSync} from 'node:fs';
const out='/downloads/polish';mkdirSync(out,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;const report={errors:[],views:[]};
try{
 await sleep(700);browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const snap=async(name)=>{await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`${out}/${name}.png`});report.views.push(await page.evaluate(name=>({name,viewport:[innerWidth,innerHeight],bodyOverflow:document.body.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.my-hand .hcard')].map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),missing:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}),name));};
 for(const [w,h] of [[320,568],[390,844],[844,390],[1280,800]]){
  await page.setViewport({width:w,height:h});await page.goto('http://localhost:4173/gostop2026/',{waitUntil:'networkidle0'});await snap(`title-${w}`);
  await page.click('#m-guide');await snap(`guide-${w}`);await page.click('[data-tab=deck]');await snap(`deck-${w}`);
  await page.$eval('.guide-screen',e=>e.scrollTop=e.scrollHeight);await snap(`deck-bottom-${w}`);
  await page.click('[data-tab=credits]');await page.$eval('.guide-screen',e=>e.scrollTop=0);await snap(`credits-${w}`);
  await page.click('.guide-back');await page.click('#m-scenario');await page.click('.stage-card');
  for(let i=0;i<5&&!(await page.$('#game-screen'));i++)await page.click('#dialogue-screen');
  await page.waitForSelector('#hand');await snap(`board-${w}`);
  await page.$eval('.table-area',e=>e.scrollTop=e.scrollHeight);await snap(`hand-${w}`);
 }
 writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{if(browser)await browser.close();server.kill();await new Promise(r=>server.once('exit',r));}

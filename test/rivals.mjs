import puppeteer from'puppeteer-core';import{spawn}from'node:child_process';import{mkdirSync,writeFileSync}from'node:fs';
const out='/downloads/rivals';mkdirSync(out,{recursive:true});const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'});let browser;const report={errors:[],views:[],profiles:0};const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{for(let i=0;i<50;i++){try{if((await fetch('http://localhost:4173/gostop2026/')).ok)break;}catch{}await pause(100);}
 browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 const snap=async name=>{await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`${out}/${name}.png`});report.views.push({name,...await page.evaluate(()=>({overflow:document.body.scrollWidth>innerWidth,missing:[...document.images].filter(i=>!i.naturalWidth).length}))});};
 for(const[w,h]of[[320,568],[390,844],[1280,800]]){await page.setViewport({width:w,height:h});await page.goto('http://localhost:4173/gostop2026/',{waitUntil:'networkidle0'});await page.click('#m-guide');await page.click('[data-tab=rivals]');await snap(`gallery-${w}`);await page.$eval('.rival-entry:last-child',e=>e.scrollIntoView());await snap(`gallery-bottom-${w}`);await page.click('.rival-entry');await snap(`profile1-${w}`);
  for(let i=0;i<12;i++){await page.evaluate(()=>Promise.all([...document.querySelectorAll('.rival-overlay img')].map(i=>i.decode())));report.profiles++;if(i===5||i===11)await snap(`profile${i+1}-${w}`);await page.click('[data-action=next]');}
  await page.keyboard.press('Tab');if(!await page.evaluate(()=>!!document.activeElement?.closest('.rival-overlay')))throw new Error('focus escaped');await page.keyboard.press('Escape');if(await page.$('.rival-overlay'))throw new Error('Escape failed');
 }
 console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();}

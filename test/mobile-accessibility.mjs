import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='/downloads/mobile-accessibility';mkdirSync(out,{recursive:true});
const server=spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4174'],{stdio:'ignore'});let b;const report={errors:[],views:[],zoom:null};
try{
 b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.evaluateOnNewDocument(()=>{let n=23;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};});
 for(const width of [320,390,1280]){
  await p.setViewport({width,height:width===320?568:844,isMobile:width<500,hasTouch:width<500});await p.goto('http://localhost:4174/gostop2026/',{waitUntil:'networkidle0'});
  const meta=await p.$eval('meta[name=viewport]',e=>e.content);if(/maximum-scale|user-scalable=no/.test(meta))throw Error('zoom disabled');
  await p.keyboard.press('Tab');await p.keyboard.press('Enter');if(!await p.evaluate(()=>document.activeElement?.tagName==='H2'))throw Error('no screen heading focus');
  await p.keyboard.press('Tab');await p.keyboard.press('Enter');await p.screenshot({path:`${out}/dialogue-${width}.png`});
  if(!await p.$eval('#dialogue-screen',e=>e.getAttribute('aria-label').includes(e.querySelector('.dialogue-text').textContent)))throw Error('inaccessible dialogue');
  while(await p.$('#dialogue-screen'))await p.keyboard.press('Enter');await p.waitForFunction(()=>document.activeElement?.closest('#hand'));
  await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await p.keyboard.press('ArrowRight');await p.screenshot({path:`${out}/focus-${width}.png`});
  if(await p.evaluate(()=>document.body.scrollWidth>innerWidth))throw Error('horizontal overflow');
  report.views.push(width);
 }
 await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await p.goto('http://localhost:4174/gostop2026/',{waitUntil:'networkidle0'});await p.click('#m-settings');
 const c=await p.createCDPSession();await c.send('Input.synthesizePinchGesture',{x:195,y:300,scaleFactor:2,relativeSpeed:800,gestureSourceType:'touch'});
 report.gestureScale=await p.evaluate(()=>visualViewport.scale);await c.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});await p.waitForFunction(()=>visualViewport.scale>1.1);report.zoom=await p.evaluate(()=>({scale:visualViewport.scale,width:visualViewport.width,height:visualViewport.height}));await p.screenshot({path:`${out}/pinch-zoom.png`});
 if(report.errors.length)throw Error('page errors');console.log(JSON.stringify(report));
}finally{writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));if(b)await b.close();server.kill();}

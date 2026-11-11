// A delayed decoded image must pass, a failed one must fail before a screenshot.
import puppeteer from 'puppeteer-core';
import {readyImages} from './ready-images.mjs';
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--no-zygote','--renderer-process-limit=2']});
try{
 const p=await b.newPage();await p.setRequestInterception(true);
 p.on('request',async r=>{if(r.url().endsWith('/delayed.svg')){await new Promise(done=>setTimeout(done,300));await r.respond({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60"><rect width="40" height="60" fill="red"/></svg>'});}else if(r.url().endsWith('/missing.svg'))await r.abort();else await r.continue();});
 await p.setContent('<img src="https://qa.invalid/delayed.svg" alt="delayed card">',{waitUntil:'domcontentloaded'});
 if(await p.$eval('img',i=>i.complete))throw Error('delayed fixture was not delayed');
 await readyImages(p);
 if(!await p.$eval('img',i=>i.complete&&i.naturalWidth===40))throw Error('readyImages returned before decode');
 await p.setContent('<img src="https://qa.invalid/missing.svg" alt="missing card">',{waitUntil:'domcontentloaded'});
 let rejected=false;try{await readyImages(p);}catch(e){rejected=e.message.includes('Image validation failed: https://qa.invalid/missing.svg');}
 if(!rejected)throw Error('failed card image accepted');
 console.log('readyImages: delayed decode waited; failed image rejected');
}finally{await b.close();}
